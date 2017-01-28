var Legend = (function () {
    function Legend(uni) {
        this.uni = uni;
    }

    Legend.prototype._sortNodes = function () {
        var tags = this.uni.tags;

        var byCat = d3.nest()
            .key(function(d) {
                return tags[d.id].cat;
            })
            .entries(this.uni.nodes.filter(function (d) {
                return d.id;
            }))
        ;

        var combined = [];
        byCat.forEach(function (d) {
            d.values.sort(function (a, b) {
                var titleA = tags[a.id].title;
                var titleB = tags[b.id].title;

                return titleA.localeCompare(titleB);
            });

            combined = combined.concat(d.values);
        });

        return combined;
    };

    Legend.prototype.draw = function () {
        var self = this;
        var nodes = this._sortNodes();
        var container = d3.select('.container-fluid')
            .append('div')
            .attr('class', 'row tag-lists')
        ;

        var i, j, chunk, chunkSize = Math.ceil(nodes.length / this.uni.opts.legendColumns);
        for (i = 0, j = nodes.length; i < j; i += chunkSize) {
            chunk = nodes.slice(i, i + chunkSize);

            container
                .append('div')
                    .attr('class', 'col-md-1')
                .append('ul')
                    .selectAll('li')
                    .data(chunk).enter()
                .append('li')
                    .html(function (d) {
                        return '<span class="star"><span style="color: ' + self.uni.color(self.uni.tags[d.id].cat) + ';" class="glyphicon glyphicon-star"></span></span>' + self.uni.tags[d.id].title;
                    })
                    .on("click", function (d) {
                        self.uni.nodeClick(d);
                    })
            ;
        }
    };

    return Legend;
})();
